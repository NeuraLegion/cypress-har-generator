import { Plugin, RecordOptions, SaveOptions } from './Plugin';
import { FileManager, Logger, StringUtils } from './utils';
import { DefaultConnectionFactory } from './cdp';
import { DefaultObserverFactory } from './network';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Cypress {
    interface Chainable<Subject = any> {
      saveHar(options?: Partial<SaveOptions>): Chainable<Subject>;
      recordHar(options?: RecordOptions): Chainable<Subject>;
      disposeOfHar(): Chainable<Subject>;
    }
  }
}

const plugin = new Plugin(
  Logger.Instance,
  FileManager.Instance,
  new DefaultConnectionFactory(Logger.Instance),
  new DefaultObserverFactory(Logger.Instance)
);

export const install = (on: Cypress.PluginEvents): void => {
  on('task', {
    saveHar: (options: SaveOptions): Promise<void> => plugin.saveHar(options),
    recordHar: (options: RecordOptions): Promise<void> =>
      plugin.recordHar(options),
    disposeOfHar: (): Promise<void> => plugin.disposeOfHar()
  });

  on(
    'before:browser:launch',
    (
      browser: Cypress.Browser | null,
      launchOptions: Cypress.BrowserLaunchOptions
    ) => {
      ensureBrowserFlags((browser ?? {}) as Cypress.Browser, launchOptions);

      return launchOptions;
    }
  );
};

export const enableExperimentalLifecycle = (
  on: Cypress.PluginEvents,
  config: Cypress.PluginConfigOptions
) => {
  // FIXME: `isInteractive` is always true. For details see https://github.com/cypress-io/cypress/issues/20789
  if (!config.isTextTerminal && !config.experimentalInteractiveRunEvents) {
    Logger.Instance.warn(
      'To activate the experimental mechanism for setting up lifecycle, you must either disable the interactive mode or activate the "experimentalInteractiveRunEvents" feature. For further information, please refer to: https://docs.cypress.io/guides/references/experiments#Configuration'
    );
  } else {
    on('before:spec', () => plugin.recordHar({}));
    on('after:spec', (spec: Cypress.Spec) =>
      plugin.saveHar({
        fileName: StringUtils.normalizeName(spec.name, { ext: '.har' }),
        outDir: config.env.hars_folders ?? '.'
      })
    );
  }
};

/**
 * Function has been deprecated. Use {@link install} instead as follows:
 * ```diff
 * setupNodeEvents(on) {
 *   install(on);
 * -  // bind to the event we care about
 * -  on('before:browser:launch', (browser = {}, launchOptions) => {
 * -    ensureBrowserFlags(browser, launchOptions);
 * -    return launchOptions;
 * -  });
 * }
 * ```
 * In case of any issues please refer to {@link https://github.com/cypress-io/cypress/issues/5240}
 */
export const ensureBrowserFlags = (
  browser: Cypress.Browser,
  launchOptions: Cypress.BrowserLaunchOptions
): void => {
  launchOptions.args.push(
    ...plugin.ensureBrowserFlags(browser, launchOptions.args)
  );
};

export { SaveOptions, RecordOptions } from './Plugin';
