import { Plugin } from './Plugin';
import { Logger } from './utils';

export interface PluginOptions extends Cypress.ConfigOptions {
  harFile: string;
}

export function install(
  on: (
    event: 'before:browser:launch' | 'task',
    callback: (browser: Cypress.Browser, args: string[]) => string[]
  ) => void
): void {
  const plugin: Plugin = new Plugin(Logger.Instance);
  on('before:browser:launch', (browser: Cypress.Browser, args: string[]) =>
    plugin.install(browser, args)
  );
  on('task', {
    removeHarFile(options: PluginOptions): Promise<void> {
      return plugin.removeHarFile(options);
    },
    recordHar(): Promise<void> {
      return plugin.recordHar();
    },
    saveHar(options: PluginOptions): Promise<void> {
      return plugin.saveHar(options);
    }
  } as any);
}
