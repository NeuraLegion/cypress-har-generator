import { RecordOptions, SaveOptions } from './Plugin';
import { StringUtils } from './utils/StringUtils';

Cypress.Commands.add(
  'recordHar',
  (options?: RecordOptions): Cypress.Chainable =>
    cy.task('recordHar', Object.assign({ content: true }, options))
);

Cypress.Commands.add(
  'saveHar',
  (options?: Partial<SaveOptions>): Cypress.Chainable => {
    const fallbackFileName = Cypress.spec.name;
    const outDir = (Cypress.env('hars_folders') as string) ?? './';

    options = Object.assign({ outDir }, options, {
      fileName: StringUtils.normalizeName(
        options?.fileName ?? fallbackFileName,
        !options?.fileName ? { ext: '.har' } : undefined
      )
    });

    return cy.task('saveHar', options);
  }
);

Cypress.Commands.add(
  'disposeOfHar',
  (): Cypress.Chainable => cy.task('disposeOfHar')
);
