describe('HAR creator', () => {
  const packageJsonPath = 'package.json';

  it('generates a HAR with expected creator', () => {
    cy.recordHar();

    cy.visit('/');

    cy.saveHar({ waitForIdle: true });

    cy.readFile(packageJsonPath).then(({ version, name }) =>
      cy.findHar().its('log.creator').should('contain', {
        name,
        version
      })
    );
  });
});
