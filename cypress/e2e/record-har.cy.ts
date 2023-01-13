describe('Record HAR', () => {
  beforeEach(() => {
    cy.intercept('assets/flowers.jpg').as('getImage');
    cy.intercept('api/products').as('getProducts');

    cy.visit('/');

    cy.get('a[href$=fetch]').as('fetchPage');
    cy.get('a[href$=frame]').as('framePage');
  });

  it('excludes a request by mime type', () => {
    cy.recordHar({ includeMimes: ['application/json'] });

    cy.get('@fetchPage').click();
    cy.wait(['@getImage', '@getProducts']).each(x =>
      cy.wrap(x).its('response.statusCode').should('eq', 200)
    );

    cy.saveHar({ waitForIdle: true });

    cy.findHar()
      .its('log.entries')
      .should('all.contain.something.like', {
        response: {
          content: { mimeType: 'application/json' }
        }
      });
  });

  it('excludes a request by its path', () => {
    const regexp = /^\/api\/products$/;
    cy.recordHar({ excludePaths: [regexp.source] });

    cy.get('@fetchPage').click();
    cy.wait(['@getImage', '@getProducts']).each(x =>
      cy.wrap(x).its('response.statusCode').should('eq', 200)
    );

    cy.saveHar({ waitForIdle: true });

    cy.findHar()
      .its('log.entries')
      .should('not.contain.something.like', {
        request: {
          url: regexp
        }
      });
  });

  it('excludes a request by the status code', () => {
    cy.recordHar({ excludeStatusCodes: [500] });

    cy.visit('/pages/unknown', { failOnStatusCode: false });

    cy.saveHar({ waitForIdle: true });

    cy.findHar()
      .its('log.entries')
      .should('not.contain.something.like', {
        response: {
          status: 500
        }
      });
  });

  it('includes only a request when it host matches', () => {
    cy.recordHar({ includeHosts: ['www.openstreetmap.org'] });

    cy.get('@framePage').click();

    cy.saveHar({ waitForIdle: true });

    cy.findHar()
      .its('log.entries')
      .should('all.contain.something.like', {
        request: {
          url: /www\.openstreetmap\.org/
        }
      });
  });

  it('includes only a request responding with the status code equal or greater than the threshold', () => {
    cy.recordHar({ minStatusCodeToInclude: 400 });

    cy.visit('/pages/unknown', { failOnStatusCode: false });

    cy.saveHar({ waitForIdle: true });

    cy.findHar()
      .its('log.entries')
      .should('all.contain.something.like', {
        response: {
          status: 500
        }
      });
  });

  it('records a response body', () => {
    cy.recordHar();

    cy.get('@fetchPage').click();
    cy.wait('@getProducts').its('response.statusCode').should('eq', 200);

    cy.saveHar({ waitForIdle: true });

    cy.findHar()
      .its('log.entries')
      .should('contain.something.like', {
        response: {
          content: { text: /\{"products":\[/ }
        }
      });
  });

  it('skips loading a response body', () => {
    cy.recordHar({ content: false });

    cy.get('@fetchPage').click();
    cy.wait('@getProducts').its('response.statusCode').should('eq', 200);

    cy.saveHar({ waitForIdle: true });

    cy.findHar()
      .its('log.entries')
      .should('not.contain.something.like', {
        response: {
          content: { text: /\{"products":\[/, mimeType: 'application/json' }
        }
      });
  });
});
