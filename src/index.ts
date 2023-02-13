import { Plugin } from './Plugin';
import { Logger } from './utils/Logger';
import { FileManager } from './utils/FileManager';
import { DefaultConnectionFactory } from './cdp';
import { DefaultHarExporterFactory, DefaultObserverFactory } from './network';
import { StringUtils } from './utils/StringUtils';
import type { RecordOptions, SaveOptions } from './Plugin';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Cypress {
    interface Chainable<Subject> {
      saveHar(options?: Partial<SaveOptions>): Chainable<Subject>;
      recordHar(options?: Partial<RecordOptions>): Chainable<Subject>;
      disposeOfHar(): Chainable<Subject>;
    }
  }
}

const plugin = new Plugin(
  Logger.Instance,
  FileManager.Instance,
  new DefaultConnectionFactory(Logger.Instance),
  new DefaultObserverFactory(Logger.Instance),
  new DefaultHarExporterFactory(FileManager.Instance, Logger.Instance)
);

export const install = (on: Cypress.PluginEvents): void => {
  // ADHOC: Cypress expect the return value to be null to signal that the given event has been handled properly.
  // https://docs.cypress.io/api/commands/task#Usage
  on('task', {
    saveHar: async (options: SaveOptions): Promise<null> => {
      await plugin.saveHar(options);

      return null;
    },
    recordHar: async (options: RecordOptions): Promise<null> => {
      await plugin.recordHar(options);

      return null;
    },
    disposeOfHar: async (): Promise<null> => {
      await plugin.disposeOfHar();

      return null;
    }
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
    on('before:spec', (_: Cypress.Spec) =>
      plugin.recordHar({
        content: true,
        includeBlobs: true,
        rootDir: StringUtils.dirname(Cypress.spec.absolute)
      })
    );
    on('after:spec', (spec: Cypress.Spec, _: CypressCommandLine.RunResult) =>
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

export type { SaveOptions, RecordOptions } from './Plugin';
