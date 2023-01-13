import '../../src/commands';
import { Har } from 'har-format';
import like from 'chai-like';
import things from 'chai-things';

chai.use(like);
chai.use(things);

like.extend({
  match(object: string, expected: RegExp) {
    return typeof object === 'string' && expected instanceof RegExp;
  },
  assert(object: string, expected: RegExp) {
    return expected.test(object);
  }
});

// assert a recorded HAR file
Cypress.Commands.add('findHar', (fileName?: string) =>
  cy
    .readFile(fileName ?? Cypress.spec.name.replace('.ts', '.har'))
    .then(data => cy.wrap<Har>(JSON.parse(data)))
);
