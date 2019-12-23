import { Plugin } from './Plugin';
import { Logger } from './utils';

interface CypressTasks {
  saveHar(fileName: string): Promise<void>;

  recordHar(): Promise<void>;
}

type CypressCallback = (event: 'task', arg?: CypressTasks) => void;

const plugin: Plugin = new Plugin(Logger.Instance);

export const install = (on: CypressCallback): void => {
  on('task', {
    saveHar: (fileName: string): Promise<void> => plugin.saveHar(fileName),
    recordHar: (): Promise<void> => plugin.recordHar()
  });
};

export const ensureRequiredBrowserFlags = (
  browser: Cypress.Browser,
  args: string[]
): string[] => plugin.ensureRequiredBrowserFlags(browser, args);
