import { Plugin } from './Plugin';
import { Logger } from './utils';
import { PluginOptions } from './PluginOptions';

type CypressInstallationCallback = (
  browser: Cypress.Browser,
  args: string[]
) => Promise<string[]> | string[];

interface CypressTasks {
  saveHar(options: PluginOptions): Promise<void>;
  recordHar(options: PluginOptions): Promise<void>;
  removeHar(options: PluginOptions): Promise<void>;
}

type InstallationArg = CypressInstallationCallback | CypressTasks;

type CypressPluginEvent = 'before:browser:launch' | 'task';

type CypressCallback = (
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
    saveHar: (): Promise<void> => plugin.saveHar(),
    recordHar: (): Promise<void> => plugin.recordHar(),
    removeHar: (): Promise<void> => plugin.removeHar()
  });
}
