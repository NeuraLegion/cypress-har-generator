'use strict';

before(() => {
  cy.task('removeHar');
  cy.task('recordHar');
});

after(() => cy.task('saveHar'));
