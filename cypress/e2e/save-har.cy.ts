describe('Save HAR', () => {
  beforeEach(() => {
    Cypress.env('hars_folders', undefined);

    cy.visit('/');

    const fileName = Cypress.spec.name.replace('.ts', '.har');

    cy.tmpdir()
      .then(outDir =>
        cy.remove(outDir).remove(fileName).wrap({
          outDir,
          fileName
        })
      )
      .as('options');
  });

  it('does nothing when no recorded entries', () => {
    cy.recordHar();
    cy.saveHar();
    cy.get('@options')
      .its('fileName')
      .then(fileName => cy.exists(fileName).should('be.false'));
  });

  it('does nothing when recording is not initiated yet', () => {
    cy.saveHar();
    cy.get('@options')
      .its('fileName')
      .then(fileName => cy.exists(fileName).should('be.false'));
  });

  it('saves a HAR file to the root folder', () => {
    cy.recordHar();

    cy.visit('/');
    cy.get('a[href$=fetch]').click();
    cy.get('ul > li', { timeout: 300 }).should('have.length.gte', 1);

    cy.saveHar();
    cy.get('@options')
      .its('fileName')
      .then(fileName => cy.exists(fileName).should('be.true'));
  });

  it('saves a HAR file to the folder specified by env variable', () => {
    cy.recordHar();
    cy.get('@options')
      .its('outDir')
      .then(value => {
        Cypress.env('hars_folders', value);
      });

    cy.visit('/');
    cy.get('a[href$=fetch]').click();
    cy.get('ul > li', { timeout: 300 }).should('have.length.gte', 1);

    cy.saveHar();
    cy.get('@options')
      .its('fileName')
      .then(fileName => {
        const path = `${Cypress.env('hars_folders')}/${fileName}`;

        cy.exists(path).should('be.true');
      });
  });

  it('saves a HAR file to the custom folder', () => {
    cy.recordHar();

    cy.visit('/');
    cy.get('a[href$=fetch]').click();
    cy.get('ul > li', { timeout: 300 }).should('have.length.gte', 1);

    cy.get<{ outDir: string; fileName: string }>('@options').then(options => {
      cy.saveHar({ outDir: options.outDir });
      const path = `${options.outDir}/${options.fileName}`;
      cy.exists(path).should('be.true');
    });
  });

  it('saves a HAR file with a custom name', () => {
    cy.recordHar();

    cy.visit('/');
    cy.get('a[href$=fetch]').click();
    cy.get('ul > li', { timeout: 300 }).should('have.length.gte', 1);

    const fileName = 'test.json';

    cy.get<{ outDir: string; fileName: string }>('@options').then(options => {
      cy.saveHar({ fileName, outDir: options.outDir });
      const path = `${options.outDir}/${fileName}`;
      cy.exists(path).should('be.true');
    });
  });

  it('saves a HAR file with a default extension', () => {
    cy.recordHar();

    cy.visit('/');
    cy.get('a[href$=fetch]').click();
    cy.get('ul > li', { timeout: 300 }).should('have.length.gte', 1);

    const fileName = 'test';

    cy.get<{ outDir: string; fileName: string }>('@options').then(options => {
      cy.saveHar({ fileName, outDir: options.outDir });
      const path = `${options.outDir}/${fileName}.har`;
      cy.exists(path).should('be.true');
    });
  });
});
