describe('Record network issues', () => {
  const url = 'https://unknown-non-well-defined-host.cypress.test.org';

  beforeEach(() => {
    cy.once('fail', () => false);
    cy.intercept(url).as('err');
  });

  afterEach(() => {
    cy.wait('@err').its('error.code').should('eq', 'ENOTFOUND');

    cy.saveHar({ waitForIdle: true });

    cy.findHar().its('log.entries').should('contain.something.like', {
      request: {
        url
      }
    });
  });

  // ADHOC: Normally, a request with an error should be included,
  // but the cy.visit() fails ahead of time due to a resolving mechanism in Cypress.
  // For details please follow the code at
  // https://github.com/cypress-io/cypress/blob/fc43cecdadda62521f6167e16b48ebc37ccc858a/packages/driver/src/cy/commands/navigation.ts#L464
  it.skip('records a request failed due DNS issues', () => {
    cy.recordHar();

    cy.visit(url, {
      failOnStatusCode: false,
      retryOnNetworkFailure: false
    });
  });
});
