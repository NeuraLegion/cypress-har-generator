/// <reference types="cypress" />

// eslint-disable-next-line @typescript-eslint/no-namespace
namespace Cypress {
  type ChainableCallback = (content: Cypress.Chainable) => Cypress.Chainable;

  interface Chainable<Subject> {
    assertHar(assert: ChainableCallback): Chainable<Subject>;

    assertHar(fileName: string, assert: ChainableCallback): Chainable<Subject>;
  }
}
