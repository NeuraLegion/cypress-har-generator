describe('HAR creator', () => {
  const packageJsonPath = 'package.json';

  it('generates a HAR with expected creator', () => {
    cy.recordHar();

    cy.intercept('/').as('page').visit('/').wait('@page');

    cy.saveHar();

    cy.readFile(packageJsonPath).then(({ version, name }) =>
      cy.assertHar(data =>
        data.its('log.creator').should('contain', {
          name,
          version
        })
      )
    );
  });
});
