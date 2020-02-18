import { Plugin } from './Plugin';
import { FileManager, Logger } from './utils';
import { join } from 'path';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Cypress {
    interface Chainable<Subject = any> {
      saveHar(fileName?: string): Chainable<Subject>;
      recordHar(): Chainable<Subject>;
    }
  }
}

export interface SaveOptions {
  harsFolder: string;
  fileName: string;
}

interface CypressTasks {
  saveHar(options: SaveOptions): Promise<void>;

  recordHar(): Promise<void>;
}

type CypressCallback = (event: 'task', arg?: CypressTasks) => void;

const plugin: Plugin = new Plugin(Logger.Instance, FileManager.Instance);

export const install = (on: CypressCallback): void => {
  on('task', {
    saveHar: ({ harsFolder, fileName }: SaveOptions): Promise<void> =>
      plugin.saveHar(join(harsFolder, fileName)),
    recordHar: (): Promise<void> => plugin.recordHar()
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
