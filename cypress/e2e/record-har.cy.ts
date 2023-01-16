describe('Record HAR', () => {
  beforeEach(() => {
    cy.visit('/');

    cy.get('a[href$=fetch]').as('fetchPage');
    cy.get('a[href$=frame]').as('framePage');
    cy.get('a[href$=service-worker]').as('serviceWorkerPage');
    cy.get('a[href$=web-worker]').as('webWorkerPage');
  });

  it('excludes a request by mime type', () => {
    cy.recordHar({ includeMimes: ['application/json'] });

    cy.get('@fetchPage').click();

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

    cy.saveHar({ waitForIdle: true });

    cy.findHar()
      .its('log.entries')
      .should('contain.something.like', {
        response: {
          content: { text: /\{"products":\[/ }
        }
      });
  });

  it('records blobs loaded by the Service Worker', () => {
    cy.recordHar();

    cy.get('@serviceWorkerPage').click();

    cy.saveHar({ waitForIdle: true });

    cy.findHar()
      .its('log.entries')
      .should('contain.something.like', {
        request: {
          url: /^blob:/
        }
      });
  });

  it('records requests from by the Web Worker', () => {
    cy.recordHar();

    cy.get('@webWorkerPage').click();

    cy.get('#number1').type('2').blur();
    cy.get('#number2').type('4').blur();

    cy.saveHar({ waitForIdle: true });

    cy.findHar()
      .its('log.entries')
      .should('contain.something.like', {
        request: {
          url: /math$/,
          postData: {
            mimeType: 'application/json',
            text: /"op":"sum"/
          }
        }
      });
  });

  it('excludes blobs loaded by the Service Worker', () => {
    cy.recordHar({ includeBlobs: false });

    cy.get('@serviceWorkerPage').click();

    cy.saveHar({ waitForIdle: true });

    cy.findHar()
      .its('log.entries')
      .should('not.contain.something.like', {
        request: {
          url: /^blob:/
        }
      });
  });

  it('skips loading a response body', () => {
    cy.recordHar({ content: false });

    cy.get('@fetchPage').click();

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
