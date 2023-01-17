// ADHOC: A few tests are deliberately skipped. CDP does not throttle the request
// while new page navigation (e.g. clicking on a link with target=_blank). Anyway,
// this can hardly be considered an issue due to [a known limitation of Cypress](https://docs.cypress.io/guides/references/trade-offs#Multiple-tabs)
// when working with multiple tabs.
describe('Multi targets', () => {
  beforeEach(() => cy.visit('/'));

  it('records requests from both popup and opener', () => {
    cy.recordHar();

    cy.get('a[href$=multi-targets]').click();
    cy.get('#popup-window').click();

    cy.saveHar({ waitForIdle: true });

    cy.findHar()
      .its('log.entries')
      .should('contain.something.like', {
        request: {
          url: /\/popup$/
        }
      })
      .should('contain.something.like', {
        request: {
          url: /\/multi-targets$/
        }
      });
  });

  it('records requests from web workers', () => {
    cy.recordHar();

    cy.visit('/pages/worker');
    cy.get('#number1').type('2');
    cy.get('#number2').type('4');
    cy.get('#avg-web-worker').click();

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
      })
      .should('contain.something.like', {
        request: {
          url: /math$/,
          postData: {
            mimeType: 'application/json',
            text: /"op":"divide"/
          }
        }
      });
  });

  it.skip('records requests from a new tab', () => {
    cy.recordHar();

    cy.get('a[href$=multi-targets]').click();
    cy.get('#new-window-noopener').click();

    cy.saveHar({ waitForIdle: true });

    cy.findHar()
      .its('log.entries')
      .should('contain.something.like', {
        request: {
          url: /\/popup$/
        }
      })
      .should('contain.something.like', {
        request: {
          url: /\/multi-targets$/
        }
      });
  });

  it.skip('records requests from both new tab and opener', () => {
    cy.recordHar();

    cy.get('a[href$=multi-targets]').click();
    cy.get('#new-window').click();

    cy.saveHar({ waitForIdle: true });

    cy.findHar()
      .its('log.entries')
      .should('contain.something.like', {
        request: {
          url: /\/popup$/
        }
      })
      .should('contain.something.like', {
        request: {
          url: /\/multi-targets$/
        }
      });
  });
});
