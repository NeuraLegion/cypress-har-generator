import { Plugin } from './Plugin.js';
import { DefaultConnectionFactory } from './cdp/DefaultConnectionFactory.js';
import { Logger } from './utils/Logger.js';
import { DefaultHarExporterFactory } from './network/DefaultHarExporterFactory.js';
import { FileManager } from './utils/FileManager.js';
import { type RecordOptions, type SaveOptions } from './Plugin.js';
import { DefaultObserverFactory } from './network/DefaultObserverFactory.js';
import { StringUtils } from './utils/StringUtils.js';

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

export type InstallOptions = {
  on: Cypress.PluginEvents;
} & (
  | {
      config: Cypress.PluginConfigOptions;
      experimentalLifecycle: true;
    }
  | {
      experimentalLifecycle?: false | undefined;
      config?: Cypress.PluginConfigOptions | undefined;
    }
);

const plugin = new Plugin(
  Logger.Instance,
  FileManager.Instance,
  new DefaultConnectionFactory(Logger.Instance),
  new DefaultObserverFactory(Logger.Instance),
  new DefaultHarExporterFactory(FileManager.Instance, Logger.Instance)
);

export const install = (options: Cypress.PluginEvents | InstallOptions) => {
  const { on, config, experimentalLifecycle } =
    typeof options === 'function'
      ? ({ on: options } as InstallOptions)
      : options;

  registerTasks(on);

  configure(on);

  if (experimentalLifecycle) {
    enableExperimentalLifecycle(on, config);
  }
};

const registerTasks = (on: Cypress.PluginEvents) => {
  // ADHOC: Cypress expect the return value to be null to signal that the given event has been handled properly.
  // https://docs.cypress.io/api/commands/task#Usage
  on('task', {
    saveHar: async (data: SaveOptions): Promise<null> => {
      await plugin.saveHar(data);

      return null;
    },
    recordHar: async (data: RecordOptions): Promise<null> => {
      await plugin.recordHar(data);

      return null;
    },
    disposeOfHar: async (): Promise<null> => {
      await plugin.disposeOfHar();

      return null;
    }
  });
};

const configure = (on: Cypress.PluginEvents) => {
  on(
    'before:browser:launch',
    (
      browser: Cypress.Browser | null,
      launchOptions: Cypress.BeforeBrowserLaunchOptions
    ) => {
      launchOptions.args.push(
        ...plugin.ensureBrowserFlags(
          browser ?? ({} as Cypress.Browser),
          launchOptions.args
        )
      );

      return launchOptions;
    }
  );
};

const enableExperimentalLifecycle = (
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
        rootDir: StringUtils.dirname(Cypress.spec.absolute)
      })
    );
    on('after:spec', (spec: Cypress.Spec, _: CypressCommandLine.RunResult) =>
      plugin.saveHar({
        fileName: StringUtils.normalizeName(spec.name, { ext: '.har' }),
        outDir: config.env.hars_folder ?? '.'
      })
    );
  }
};

export type { SaveOptions, RecordOptions } from './Plugin.js';
