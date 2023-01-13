/// <reference types="cypress" />

namespace Cypress {
  import { Har } from 'har-format';

  interface Chainable<Subject> {
    findHar(fileName?: string): Chainable<Har>;
  }
}
