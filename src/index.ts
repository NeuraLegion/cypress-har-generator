import { Plugin, RecordOptions, SaveOptions } from './Plugin';
import { FileManager, Logger } from './utils';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Cypress {
    interface Chainable<Subject = any> {
      saveHar(options?: Partial<SaveOptions>): Chainable<Subject>;

      recordHar(options?: RecordOptions): Chainable<Subject>;
    }
  }
}

const plugin = new Plugin(Logger.Instance, FileManager.Instance);

export const install = (on: Cypress.PluginEvents): void => {
  on('task', {
    saveHar: (options: SaveOptions): Promise<void> => plugin.saveHar(options),
    recordHar: (options: RecordOptions): Promise<void> =>
      plugin.recordHar(options)
  });
};

export const ensureBrowserFlags = (
  browser: Cypress.Browser,
  launchOptions: Cypress.BrowserLaunchOptions
): void => {
  launchOptions.args.push(
    ...plugin.ensureBrowserFlags(browser, launchOptions.args)
  );
};

export { SaveOptions, RecordOptions } from './Plugin';
