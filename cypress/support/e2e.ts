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

const getDefaultHarPath = (): string =>
  Cypress.spec.name.replace('.ts', '.har');

// assert a recorded HAR file
Cypress.Commands.add('findHar', (fileName?: string) =>
  cy
    .readFile(fileName ?? getDefaultHarPath())
    .then(data => cy.wrap<Har>(data ? JSON.parse(data) : undefined))
);
// check if file matches with the given pattern
Cypress.Commands.add(
  'match',
  (regexp: RegExp, path: string = getDefaultHarPath()) =>
    cy.task('fs:match', { path, regexp: regexp.source })
);
// check a file/folder existence
Cypress.Commands.add('exists', (path: string) => cy.task('fs:exists', path));
// remove a file/folder
Cypress.Commands.add('remove', (path: string) => cy.task('fs:remove', path));
// return tmpdir
Cypress.Commands.add('tmpdir', () => cy.task('fs:tmpdir'));
