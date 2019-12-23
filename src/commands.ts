import { SaveOptions } from './index';

Cypress.Commands.add('recordHar', () => cy.task('recordHar'));

Cypress.Commands.add('saveHar', (fileName: string) => {
  const specFileName: string | undefined = Cypress.spec?.name;

  const defaultFileName: string = specFileName
    ? `${specFileName.substring(0, specFileName.lastIndexOf('.'))}.har`
    : 'archive.har';

  const harsFolder: string = Cypress.env('hars_folders') ?? '.';

  cy.task('saveHar', {
    harsFolder,
    fileName: fileName ?? defaultFileName
  } as SaveOptions);
});
