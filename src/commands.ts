import { RecordOptions, SaveOptions } from './Plugin';

const filename = (path: string): string | undefined => {
  const startIndex: number =
    path.indexOf('\\') >= 0 ? path.lastIndexOf('\\') : path.lastIndexOf('/');
  let name: string = path.substring(startIndex);

  if (name.indexOf('\\') === 0 || name.indexOf('/') === 0) {
    name = name.substring(1);
  }

  const startExtIndex: number = name.lastIndexOf('.');

  return name.substring(0, startExtIndex);
};

const harFileName = (path: string): string | undefined =>
  `${filename(path)}.har`;

Cypress.Commands.add(
  'recordHar',
  (options?: RecordOptions): Cypress.Chainable =>
    cy.task('recordHar', Object.assign({ content: true }, options))
);

Cypress.Commands.add(
  'saveHar',
  (options?: Partial<SaveOptions>): Cypress.Chainable => {
    const fallbackFileName: string = Cypress.spec.name;
    const outDir: string = Cypress.env('hars_folders') ?? './';

    options = Object.assign({ outDir }, options, {
      fileName: harFileName(options?.fileName ?? fallbackFileName)
    });

    return cy.task('saveHar', options);
  }
);
