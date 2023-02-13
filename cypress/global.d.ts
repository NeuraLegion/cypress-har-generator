/// <reference types="cypress" />

namespace Cypress {
  import { Har } from 'har-format';

  interface Chainable<Subject> {
    findHar(fileName?: string): Chainable<Har>;
    exists(path: string): Chainable<boolean>;
    tmpdir(): Chainable<string>;
    remove(path: string): Chainable<void>;
    match(regexp: RegExp, path?: string): Chainable<boolean>;
  }
}
