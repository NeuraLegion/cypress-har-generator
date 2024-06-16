import { StringUtils } from './utils/StringUtils.js';
import type { RecordOptions, SaveOptions } from './Plugin.js';

Cypress.Commands.add(
  'recordHar',
  (options?: Partial<RecordOptions>): Cypress.Chainable =>
    cy.task('recordHar', {
      content: true,
      includeBlobs: true,
      rootDir: StringUtils.dirname(Cypress.spec.absolute),
      ...options,
      excludePaths: options?.excludePaths?.map(x =>
        StringUtils.toRegexSource(x)
      ),
      includeHosts: options?.includeHosts?.map(x =>
        StringUtils.toRegexSource(x)
      )
    })
);

Cypress.Commands.add(
  'saveHar',
  (options?: Partial<SaveOptions>): Cypress.Chainable => {
    const fallbackFileName = Cypress.spec.name;
    const outDir = Cypress.env('hars_folder') ?? './';

    return cy.task('saveHar', {
      outDir,
      ...options,
      fileName: StringUtils.normalizeName(
        options?.fileName ?? fallbackFileName,
        !options?.fileName ? { ext: '.har' } : undefined
      )
    });
  }
);

Cypress.Commands.add(
  'disposeOfHar',
  (): Cypress.Chainable => cy.task('disposeOfHar')
);
