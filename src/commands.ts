import { RecordOptions, SaveOptions } from './Plugin';

const normalizeName = (path: string, options?: { ext?: string }): string => {
  const fileNameIdx =
    path.indexOf('\\') >= 0 ? path.lastIndexOf('\\') : path.lastIndexOf('/');
  let name = path.substring(fileNameIdx);

  if (name.indexOf('\\') === 0 || name.indexOf('/') === 0) {
    name = name.substring(1);
  }

  const extIdx = name.lastIndexOf('.');
  const ext = options?.ext ?? name.substring(extIdx);
  const nameWithoutExt = name.substring(0, extIdx);

  return `${nameWithoutExt}${ext ?? '.har'}`;
};

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
      fileName: normalizeName(
        options?.fileName ?? fallbackFileName,
        !options?.fileName ? { ext: '.har' } : undefined
      )
    });

    return cy.task('saveHar', options);
  }
);
