import '../../src/commands';

// assert a recorded HAR file
Cypress.Commands.add(
  'assertHar',
  (
    fileNameOrAssert: Cypress.ChainableCallback | string,
    assert?: Cypress.ChainableCallback
  ): Cypress.Chainable => {
    let fileName: string;

    if (typeof fileNameOrAssert === 'string') {
      fileName = fileNameOrAssert;
    } else {
      fileName = Cypress.spec.name.replace('.ts', '.har');
      assert = fileNameOrAssert;
    }

    return cy
      .readFile(fileName)
      .then(data => assert(cy.wrap(JSON.parse(data))));
  }
);
