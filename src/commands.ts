import { SaveOptions } from './index';

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

Cypress.Commands.add('recordHar', () => cy.task('recordHar'));

Cypress.Commands.add('saveHar', (fileName?: string) => {
  const specFileName: string | undefined = Cypress.spec.name;
  const harsFolder: string = Cypress.env('hars_folders') ?? '.';

  cy.task('saveHar', {
    harsFolder,
    fileName: harFileName(fileName ?? specFileName)
  } as SaveOptions);
});
